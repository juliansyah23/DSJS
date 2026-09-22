<?php

namespace App\Policies;

use App\Models\Draft;
use App\Models\User;

class DraftPolicy
{
    public function view(User $user, Draft $draft): bool
    {
        return $draft->user_id === $user->id;
    }

    public function update(User $user, Draft $draft): bool
    {
        return $this->view($user, $draft);
    }

    public function delete(User $user, Draft $draft): bool
    {
        return $this->view($user, $draft);
    }
}