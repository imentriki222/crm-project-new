<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lead extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'whatsapp',
        'company_name',
        'job_title',
        'website',
        'industry',
        'company_size',
        'city',
        'country',
        'lead_source',
        'status',
        'priority',
        'lead_score',
        'assigned_to'
    ];

    /**
     * Get the user assigned to this lead.
     */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Get the deals associated with this lead.
     */
    public function deals(): HasMany
    {
        return $this->hasMany(Deal::class, 'lead_id');
    }

    /**
     * Get the activity logs for this lead.
     */
    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class, 'lead_id');
    }

    /**
     * Get the meetings scheduled with this lead.
     */
    public function meetings(): HasMany
    {
        return $this->hasMany(Meeting::class, 'lead_id');
    }
}
