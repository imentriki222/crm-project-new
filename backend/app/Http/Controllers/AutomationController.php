<?php

namespace App\Http\Controllers;

use App\Models\AutomationRule;
use App\Models\Lead;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AutomationController extends Controller
{
    /**
     * List all automation rules.
     */
    public function index()
    {
        return response()->json(['data' => AutomationRule::orderBy('created_at', 'desc')->get()]);
    }

    /**
     * Store a new automation rule.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'trigger_event' => 'required|string',
            'conditions' => 'required|array',
            'conditions.field' => 'required|string',
            'conditions.operator' => 'required|string|in:equals,greater_than,less_than,empty',
            'conditions.value' => 'nullable|string',
            'actions' => 'required|array',
            'actions.action_type' => 'required|string|in:assign_user,send_message,trigger_webhook',
            'actions.parameters' => 'nullable|array'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $rule = AutomationRule::create($request->all());
        return response()->json(['message' => 'Automation rule created successfully', 'data' => $rule], 201);
    }

    /**
     * Toggle the active status of a rule.
     */
    public function toggle(int $id)
    {
        $rule = AutomationRule::find($id);
        if (!$rule) {
            return response()->json(['message' => 'Rule not found'], 404);
        }

        $rule->update(['is_active' => !$rule->is_active]);

        return response()->json([
            'message' => 'Rule status toggled successfully',
            'data' => $rule
        ]);
    }

    /**
     * Expose webhook endpoint for n8n integration.
     * When n8n triggers this webhook, it updates lead data or logs customer actions.
     */
    public function webhookReceiver(Request $request)
    {
        // Validate request payload from n8n
        $validator = Validator::make($request->all(), [
            'lead_id' => 'required|integer|exists:leads,id',
            'action' => 'required|string', // e.g. 'whatsapp_reply', 'email_open', 'form_filled'
            'message' => 'nullable|string',
            'update_data' => 'nullable|array' // optional fields to update on the lead
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $lead = Lead::find($request->lead_id);
        $action = $request->action;
        $details = ['n8n_triggered' => true, 'message' => $request->message];

        // Apply updates if sent by n8n
        if ($request->has('update_data') && is_array($request->update_data)) {
            $lead->update($request->update_data);
            $details['updates'] = $request->update_data;
        }

        // Log n8n interaction activity
        ActivityLog::create([
            'lead_id' => $lead->id,
            'action' => 'n8n_webhook_' . $action,
            'details' => $details
        ]);

        return response()->json([
            'message' => 'n8n webhook received and processed successfully',
            'lead' => $lead
        ]);
    }

    /**
     * Delete an automation rule.
     */
    public function destroy(int $id)
    {
        $rule = AutomationRule::find($id);
        if (!$rule) {
            return response()->json(['message' => 'Rule not found'], 404);
        }
        $rule->delete();
        return response()->json(['message' => 'Rule deleted successfully']);
    }
}
