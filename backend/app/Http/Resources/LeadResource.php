<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'name' => $this->first_name . ' ' . $this->last_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'whatsapp' => $this->whatsapp,
            'company_name' => $this->company_name,
            'job_title' => $this->job_title,
            'website' => $this->website,
            'industry' => $this->industry,
            'company_size' => $this->company_size,
            'city' => $this->city,
            'country' => $this->country,
            'lead_source' => $this->lead_source,
            'status' => $this->status,
            'priority' => $this->priority,
            'lead_score' => $this->lead_score,
            'assigned_to' => $this->assigned_to,
            'assignee' => new UserResource($this->whenLoaded('assignee')),
            'deals' => $this->whenLoaded('deals'),
            'activity_logs' => $this->whenLoaded('activityLogs'),
            'meetings' => $this->whenLoaded('meetings'),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
