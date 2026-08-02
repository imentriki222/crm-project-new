<?php

namespace App\Http\Controllers;

use App\Models\Meeting;
use App\Models\Lead;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class MeetingController extends Controller
{
    /**
     * Display a listing of meetings.
     */
    public function index(Request $request)
    {
        $meetings = Meeting::with(['lead', 'user'])->orderBy('start_time', 'asc')->get();
        return response()->json(['data' => $meetings]);
    }

    /**
     * Store a newly scheduled meeting and generate meeting links.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'lead_id' => 'required|integer|exists:leads,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'type' => 'required|string|in:google_meet,zoom,in_person'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $type = $request->type;
        $meetingLink = null;

        // Simulate generating Meet and Zoom integration links
        if ($type === 'google_meet') {
            // e.g. https://meet.google.com/abc-defg-hij
            $meetingLink = 'https://meet.google.com/' . strtolower(Str::random(3)) . '-' . strtolower(Str::random(4)) . '-' . strtolower(Str::random(3));
        } elseif ($type === 'zoom') {
            // e.g. https://zoom.us/j/123456789
            $meetingLink = 'https://zoom.us/j/' . rand(100000000, 999999999);
        }

        $meeting = Meeting::create([
            'lead_id' => $request->lead_id,
            'user_id' => $request->user()->id,
            'title' => $request->title,
            'description' => $request->description,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'type' => $type,
            'meeting_link' => $meetingLink,
            'external_event_id' => (string)Str::uuid(),
        ]);

        // Log activity for the lead (will also recalculate AI lead score!)
        ActivityLog::create([
            'lead_id' => $meeting->lead_id,
            'user_id' => $meeting->user_id,
            'action' => 'meeting_created',
            'details' => ['meeting_id' => $meeting->id, 'title' => $meeting->title, 'start_time' => $meeting->start_time, 'type' => $type]
        ]);

        return response()->json([
            'message' => 'Meeting scheduled successfully',
            'data' => $meeting->load(['lead', 'user'])
        ], 201);
    }

    /**
     * Update an existing meeting.
     */
    public function update(Request $request, int $id)
    {
        $meeting = Meeting::find($id);
        if (!$meeting) {
            return response()->json(['message' => 'Meeting not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'lead_id' => 'sometimes|integer|exists:leads,id',
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'start_time' => 'sometimes|date',
            'end_time' => 'sometimes|date|after:start_time',
            'type' => 'sometimes|string|in:google_meet,zoom,in_person'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $meeting->update($request->all());

        // Regenerate link if type changed
        if ($request->has('type') && $request->type !== $meeting->type) {
            $type = $request->type;
            $meetingLink = null;

            if ($type === 'google_meet') {
                $meetingLink = 'https://meet.google.com/' . strtolower(Str::random(3)) . '-' . strtolower(Str::random(4)) . '-' . strtolower(Str::random(3));
            } elseif ($type === 'zoom') {
                $meetingLink = 'https://zoom.us/j/' . rand(100000000, 999999999);
            }

            $meeting->update([
                'type' => $type,
                'meeting_link' => $meetingLink
            ]);
        }

        return response()->json([
            'message' => 'Meeting updated successfully',
            'data' => $meeting->load(['lead', 'user'])
        ]);
    }

    /**
     * Delete a scheduled meeting.
     */
    public function destroy(int $id)
    {
        $meeting = Meeting::find($id);
        if (!$meeting) {
            return response()->json(['message' => 'Meeting not found'], 404);
        }

        ActivityLog::create([
            'lead_id' => $meeting->lead_id,
            'user_id' => $meeting->user_id,
            'action' => 'meeting_cancelled',
            'details' => ['title' => $meeting->title, 'start_time' => $meeting->start_time]
        ]);

        $meeting->delete();
        return response()->json(['message' => 'Meeting deleted successfully']);
    }
}
