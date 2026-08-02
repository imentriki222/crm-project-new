<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            // Personal
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('whatsapp')->nullable();

            // Company
            $table->string('company_name')->nullable();
            $table->string('job_title')->nullable();
            $table->string('website')->nullable();
            $table->string('industry')->nullable();
            $table->string('company_size')->nullable(); // e.g. 1-10, 11-50, 51-200, 201-500, 500+
            $table->string('city')->nullable();
            $table->string('country')->nullable();

            // CRM
            $table->string('lead_source')->default('organic'); // organic, google_ads, social_media, referral, cold_call, other
            $table->string('status')->default('new'); // new, contacted, qualified, proposal, negotiation, won, lost
            $table->string('priority')->default('medium'); // low, medium, high
            $table->integer('lead_score')->default(0); // AI scored 0-100
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
