<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
            $table->dropColumn('customer_id');
            $table->string('customer_name')->after('id')->nullable();
        });

        Schema::dropIfExists('customers');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['retail', 'wholesale'])->default('retail');
            $table->string('phone')->nullable();
            $table->decimal('credit_limit', 10, 2)->default(0);
            $table->timestamps();
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->foreignId('customer_id')->nullable()->constrained();
            $table->dropColumn('customer_name');
        });
    }
};
