<?php

namespace App\Http\Controllers;

use App\Models\Deal;
use App\Models\Lead;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DealController extends Controller
{
    /**
     * Display a listing of deals with their associated lead details.
     */
    public function index(Request $request)
    {
        $deals = Deal::with('lead.assignee')->orderBy('updated_at', 'desc')->get();
        return response()->json(['data' => $deals]);
    }

    /**
     * Create a new deal for a lead.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'lead_id' => 'required|integer|exists:leads,id',
            'name' => 'required|string|max:255',
            'value' => 'required|numeric|min:0',
            'stage' => 'required|string|in:new_lead,contacted,meeting_scheduled,proposal_sent,negotiation,won,lost'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $deal = Deal::create($request->all());

        ActivityLog::create([
            'lead_id' => $deal->lead_id,
            'user_id' => $request->user()?->id,
            'action' => 'deal_created',
            'details' => ['deal_name' => $deal->name, 'value' => $deal->value, 'stage' => $deal->stage]
        ]);

        return response()->json([
            'message' => 'Deal created successfully',
            'data' => $deal->load('lead')
        ], 201);
    }

    /**
     * Update the stage (column) of a deal.
     */
    public function updateStage(Request $request, int $id)
    {
        $request->validate([
            'stage' => 'required|string|in:new_lead,contacted,meeting_scheduled,proposal_sent,negotiation,won,lost'
        ]);

        $deal = Deal::find($id);
        if (!$deal) {
            return response()->json(['message' => 'Deal not found'], 404);
        }

        $oldStage = $deal->stage;
        $newStage = $request->stage;

        if ($oldStage !== $newStage) {
            $deal->update(['stage' => $newStage]);

            // Sync lead status
            $leadStatus = 'new';
            if (in_array($newStage, ['contacted', 'meeting_scheduled'])) {
                $leadStatus = 'contacted';
            } elseif (in_array($newStage, ['proposal_sent', 'negotiation'])) {
                $leadStatus = 'negotiation';
            } elseif ($newStage === 'won') {
                $leadStatus = 'won';
            } elseif ($newStage === 'lost') {
                $leadStatus = 'lost';
            }

            $lead = $deal->lead;
            if ($lead) {
                $oldStatus = $lead->status;
                if ($oldStatus !== $leadStatus) {
                    $lead->update(['status' => $leadStatus]);
                    
                    // Create status change activity log
                    ActivityLog::create([
                        'lead_id' => $lead->id,
                        'user_id' => $request->user()?->id,
                        'action' => 'status_updated',
                        'details' => ['old_status' => $oldStatus, 'new_status' => $leadStatus, 'reason' => 'Deal stage moved to ' . $newStage]
                    ]);
                }
            }

            // Create deal moved activity log
            ActivityLog::create([
                'lead_id' => $deal->lead_id,
                'user_id' => $request->user()?->id,
                'action' => 'deal_moved',
                'details' => ['deal_id' => $deal->id, 'deal_name' => $deal->name, 'old_stage' => $oldStage, 'new_stage' => $newStage]
            ]);
        }

        return response()->json([
            'message' => 'Deal stage updated successfully',
            'data' => $deal->load('lead')
        ]);
    }
}
