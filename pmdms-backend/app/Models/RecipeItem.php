<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecipeItem extends Model
{
    protected $guarded = [];

    public function raw_material()
    {
        return $this->belongsTo(RawMaterial::class);
    }
}
