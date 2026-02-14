<?php

// app/Models/Product.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;
    protected $appends = ['image_url'];

    public function getImageUrlAttribute()
    {
        if (!$this->image_path) return null;
        return asset('storage/' . $this->image_path);
    }

    protected $fillable = [
        'title','description','price','stock','is_active','image_path'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}

