<?php

namespace App\Services;

use App\Models\Lead;
use App\Models\ActivityLog;
use App\Models\AutomationRule;
use App\Repositories\LeadRepositoryInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LeadService
{
    protected LeadRepositoryInterface $leadRepository;

    public function __construct(LeadRepositoryInterface $leadRepository)
    {
        $this->leadRepository = $leadRepository;
    }

    /**
     * Get filtered leads with pagination.
     */
    public function getLeads(array $filters, int $perPage = 15)
    {
        return $this->leadRepository->getFilteredLeads($filters, $perPage);
    }

    /**
     * Get a single lead with details.
     */
    public function getLead(int $id)
    {
        return $this->leadRepository->findById($id);
    }

    /**
     * Create a new lead, trigger scoring, logging, and automations.
     */
    public function createLead(array $data, ?int $userId = null): Lead
    {
        $lead = $this->leadRepository->create($data);

        // 1. Calculate lead score
        $score = $this->calculateLeadScore($lead);
        $lead->update(['lead_score' => $score]);

        // 2. Log activity
        ActivityLog::create([
            'lead_id' => $lead->id,
            'user_id' => $userId,
            'action' => 'lead_created',
            'details' => ['message' => 'Lead created and assigned score of ' . $score]
        ]);

        // 3. Evaluate automation rules
        $this->evaluateAutomations('lead.created', $lead);

        return $lead;
    }

    /**
     * Update an existing lead, trigger scoring, logging, and automations if status/details change.
     */
    public function updateLead(int $id, array $data, ?int $userId = null): ?Lead
    {
        $leadBefore = Lead::find($id);
        if (!$leadBefore) {
            return null;
        }

        $lead = $this->leadRepository->update($id, $data);
        if (!$lead) {
            return null;
        }

        // Check if important fields changed to trigger scoring update
        $scoringFields = ['phone', 'email', 'whatsapp', 'company_size', 'job_title', 'priority', 'lead_source'];
        $recalculate = false;
        foreach ($scoringFields as $field) {
            if (isset($data[$field]) && $leadBefore->{$field} !== $lead->{$field}) {
                $recalculate = true;
                break;
            }
        }

        if ($recalculate) {
            $score = $this->calculateLeadScore($lead);
            $lead->update(['lead_score' => $score]);
            
            ActivityLog::create([
                'lead_id' => $lead->id,
                'user_id' => $userId,
                'action' => 'score_updated',
                'details' => ['old_score' => $leadBefore->lead_score, 'new_score' => $score]
            ]);

            $this->evaluateAutomations('lead.score_updated', $lead);
        }

        // Log status change if status changed
        if (isset($data['status']) && $leadBefore->status !== $lead->status) {
            ActivityLog::create([
                'lead_id' => $lead->id,
                'user_id' => $userId,
                'action' => 'status_updated',
                'details' => ['old_status' => $leadBefore->status, 'new_status' => $lead->status]
            ]);

            $this->evaluateAutomations('lead.status_updated', $lead);
        }

        return $lead;
    }

    /**
     * Delete a lead.
     */
    public function deleteLead(int $id): bool
    {
        return $this->leadRepository->delete($id);
    }

    /**
     * Calculate Lead Score dynamically based on lead information and activities.
     */
    public function calculateLeadScore(Lead $lead): int
    {
        $score = 0;

        // 1. Info Completeness (+5 per field, max +25)
        if (!empty($lead->email)) $score += 5;
        if (!empty($lead->phone)) $score += 5;
        if (!empty($lead->whatsapp)) $score += 5;
        if (!empty($lead->website)) $score += 5;
        if (!empty($lead->industry)) $score += 5;

        // 2. High-Value Job Titles (+20)
        if (!empty($lead->job_title)) {
            $jobTitle = strtolower($lead->job_title);
            $highValueTitles = ['ceo', 'cto', 'vp', 'director', 'founder', 'owner', 'manager', 'head'];
            foreach ($highValueTitles as $title) {
                if (str_contains($jobTitle, $title)) {
                    $score += 20;
                    break;
                }
            }
        }

        // 3. Enterprise Company Size (+20)
        if (!empty($lead->company_size)) {
            $size = $lead->company_size;
            if (in_array($size, ['51-200', '201-500', '500+'])) {
                $score += 20;
            } elseif ($size === '11-50') {
                $score += 10;
            }
        }

        // 4. Hot Lead Source (+15)
        if (!empty($lead->lead_source)) {
            $source = $lead->lead_source;
            if (in_array($source, ['referral', 'google_ads'])) {
                $score += 15;
            } elseif (in_array($source, ['organic', 'social_media'])) {
                $score += 10;
            }
        }

        // 5. High Priority (+20)
        if (!empty($lead->priority)) {
            if ($lead->priority === 'high') {
                $score += 20;
            } elseif ($lead->priority === 'medium') {
                $score += 10;
            }
        }

        // 6. Interaction History (+5 per activity, max +20)
        $activityCount = ActivityLog::where('lead_id', $lead->id)->count();
        $score += min($activityCount * 5, 20);

        // Cap score at 100
        return min($score, 100);
    }

    /**
     * Evaluates rules for the specific trigger and performs actions.
     */
    protected function evaluateAutomations(string $event, Lead $lead): void
    {
        $rules = AutomationRule::where('trigger_event', $event)
            ->where('is_active', true)
            ->get();

        foreach ($rules as $rule) {
            $conditionMet = true;

            // Check conditions if they exist
            if ($rule->conditions) {
                $cond = $rule->conditions;
                $field = $cond['field'] ?? null;
                $operator = $cond['operator'] ?? null;
                $value = $cond['value'] ?? null;

                if ($field) {
                    $actualValue = $lead->{$field};

                    if ($operator === 'empty') {
                        $conditionMet = empty($actualValue);
                    } elseif ($operator === 'equals') {
                        $conditionMet = ($actualValue == $value);
                    } elseif ($operator === 'greater_than') {
                        $conditionMet = ($actualValue > $value);
                    } elseif ($operator === 'less_than') {
                        $conditionMet = ($actualValue < $value);
                    }
                }
            }

            if ($conditionMet && $rule->actions) {
                $action = $rule->actions;
                $actionType = $action['action_type'] ?? null;
                $params = $action['parameters'] ?? [];

                if ($actionType === 'assign_user') {
                    // Assign to a commercial user randomly if not assigned
                    if ($params['user_role'] === 'commercial') {
                        $salesUser = \App\Models\User::where('role', 'commercial')->inRandomOrder()->first();
                        if ($salesUser) {
                            $lead->update(['assigned_to' => $salesUser->id]);
                            
                            ActivityLog::create([
                                'lead_id' => $lead->id,
                                'action' => 'automated_assignment',
                                'details' => ['assigned_to_user' => $salesUser->first_name . ' ' . $salesUser->last_name]
                            ]);
                        }
                    }
                } elseif ($actionType === 'trigger_webhook') {
                    // Send to n8n webhook asynchronously (we skip waiting)
                    $webhookUrl = $params['url'] ?? null;
                    if ($webhookUrl) {
                        try {
                            Http::timeout(2)->post($webhookUrl, [
                                'event' => $event,
                                'lead' => $lead->toArray()
                            ]);
                        } catch (\Exception $e) {
                            Log::warning("Automation webhook failed: " . $e->getMessage());
                        }
                    }
                }
            }
        }
    }
}
