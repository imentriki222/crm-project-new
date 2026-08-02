<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use App\Models\Template;
use App\Models\Lead;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CampaignController extends Controller
{
    // ==========================================
    // TEMPLATE MANAGEMENT
    // ==========================================

    public function listTemplates()
    {
        return response()->json(['data' => Template::orderBy('created_at', 'desc')->get()]);
    }

    public function storeTemplate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:email,whatsapp,sms',
            'subject' => 'nullable|string|required_if:type,email|max:255',
            'body' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $template = Template::create($request->all());
        return response()->json(['message' => 'Template created successfully', 'data' => $template], 201);
    }

    public function showTemplate(int $id)
    {
        $template = Template::find($id);
        if (!$template) {
            return response()->json(['message' => 'Template not found'], 404);
        }
        return response()->json(['data' => $template]);
    }

    public function updateTemplate(Request $request, int $id)
    {
        $template = Template::find($id);
        if (!$template) {
            return response()->json(['message' => 'Template not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|in:email,whatsapp,sms',
            'subject' => 'nullable|string|required_if:type,email|max:255',
            'body' => 'sometimes|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $template->update($request->all());
        return response()->json(['message' => 'Template updated successfully', 'data' => $template]);
    }

    public function destroyTemplate(int $id)
    {
        $template = Template::find($id);
        if (!$template) {
            return response()->json(['message' => 'Template not found'], 404);
        }
        $template->delete();
        return response()->json(['message' => 'Template deleted successfully']);
    }


    // ==========================================
    // CAMPAIGN MANAGEMENT
    // ==========================================

    public function listCampaigns()
    {
        return response()->json(['data' => Campaign::with('template')->orderBy('created_at', 'desc')->get()]);
    }

    public function storeCampaign(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'template_id' => 'required|integer|exists:templates,id',
            'scheduled_at' => 'nullable|date|after_or_equal:now'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $template = Template::find($request->template_id);
        
        $campaign = Campaign::create([
            'name' => $request->name,
            'template_id' => $request->template_id,
            'type' => $template->type,
            'status' => $request->scheduled_at ? 'scheduled' : 'draft',
            'scheduled_at' => $request->scheduled_at,
        ]);

        return response()->json(['message' => 'Campaign created successfully', 'data' => $campaign->load('template')], 201);
    }

    public function showCampaign(int $id)
    {
        $campaign = Campaign::with('template')->find($id);
        if (!$campaign) {
            return response()->json(['message' => 'Campaign not found'], 404);
        }
        return response()->json(['data' => $campaign]);
    }

    /**
     * Dispatch / Send campaign (simulated send)
     */
    public function sendCampaign(Request $request, int $id)
    {
        $campaign = Campaign::with('template')->find($id);
        if (!$campaign) {
            return response()->json(['message' => 'Campaign not found'], 404);
        }

        if ($campaign->status === 'completed') {
            return response()->json(['message' => 'Campaign has already been completed.'], 400);
        }

        $campaign->update(['status' => 'sending']);

        // Determine targets (Leads who have emails/phones based on type)
        $targetQuery = Lead::query();
        if ($campaign->type === 'email') {
            $targetQuery->whereNotNull('email');
        } else {
            $targetQuery->whereNotNull('phone');
        }

        $totalTargets = $targetQuery->count();
        if ($totalTargets === 0) {
            $campaign->update(['status' => 'failed']);
            return response()->json(['message' => 'Campaign failed: No target leads found with contact details.'], 400);
        }

        // Mock delivery statistics
        $sent = $totalTargets;
        $delivered = (int)($sent * fake()->randomFloat(2, 0.90, 0.99));
        $opened = $campaign->type === 'email' ? (int)($delivered * fake()->randomFloat(2, 0.20, 0.50)) : 0;
        $clicked = $opened > 0 ? (int)($opened * fake()->randomFloat(2, 0.08, 0.30)) : (int)($delivered * fake()->randomFloat(2, 0.10, 0.25));

        $campaign->update([
            'status' => 'completed',
            'sent_count' => $sent,
            'delivered_count' => $delivered,
            'opened_count' => $opened,
            'clicked_count' => $clicked
        ]);

        // Log activity for the first 10 targeted leads to simulate history logs
        $targetQuery->take(10)->get()->each(function ($lead) use ($campaign, $request) {
            ActivityLog::create([
                'lead_id' => $lead->id,
                'user_id' => $request->user()?->id,
                'action' => 'campaign_sent',
                'details' => ['campaign_id' => $campaign->id, 'campaign_name' => $campaign->name, 'campaign_type' => $campaign->type]
            ]);
        });

        return response()->json([
            'message' => 'Campaign sent successfully',
            'data' => $campaign
        ]);
    }

    public function destroyCampaign(int $id)
    {
        $campaign = Campaign::find($id);
        if (!$campaign) {
            return response()->json(['message' => 'Campaign not found'], 404);
        }
        $campaign->delete();
        return response()->json(['message' => 'Campaign deleted successfully']);
    }
}
