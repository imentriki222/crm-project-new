<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Campaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type', // email, whatsapp, sms
        'status', // draft, scheduled, sending, completed, failed
        'template_id',
        'scheduled_at',
        'sent_count',
        'delivered_count',
        'opened_count',
        'clicked_count'
    ];

    protected $casts = [
        'scheduled_at' => 'datetime'
    ];

    /**
     * Get the template associated with this campaign.
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class, 'template_id');
    }
}
