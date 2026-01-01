<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseItem extends Model
{
    protected $fillable = ['purchase_id', 'raw_material_id', 'qty', 'unit_price', 'subtotal'];

    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }

    public function rawMaterial()
    {
        return $this->belongsTo(RawMaterial::class, 'raw_material_id');
    }
}
