<?php

namespace App\Policies;

use App\Models\Application;
use App\Models\User;

class ApplicationPolicy
{
    public function view(User $user, Application $application): bool
    {
        return $user->isAdmin() || $application->user_id === $user->id;
    }

    public function downloadFile(User $user, Application $application): bool
    {
        return $this->view($user, $application);
    }

    public function update(User $user, Application $application): bool
    {
        return $user->isAdmin();
    }
}