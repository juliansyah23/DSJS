<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function __construct(private readonly AuditService $audit) {}

    public function index(Request $request): JsonResponse
    {
        $query = User::query()->withCount('applications');
        if ($search = trim((string) $request->query('search'))) {
            $query->where(fn ($builder) => $builder
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%"));
        }
        if (in_array($request->query('role'), ['user', 'admin'], true)) {
            $query->where('role', $request->query('role'));
        }
        if (in_array($request->query('status'), ['active', 'inactive'], true)) {
            $query->where('is_active', $request->query('status') === 'active');
        }

        $users = $query->latest()->get()->map(fn (User $user) => $this->payload($user));

        return response()->json(['success' => true, 'data' => ['users' => $users]]);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = DB::transaction(function () use ($request, $data) {
            $user = User::create([
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'phone' => $data['phone'] ?? null,
            'password' => $data['password'],
            'role' => $data['role'],
            'is_active' => $data['is_active'] ?? true,
            'email_verified_at' => ($data['email_verified'] ?? true) ? now() : null,
        ]);
            $this->audit->record($request, 'user.created', $user, null, $this->payload($user));

            return $user;
        });

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil ditambahkan.',
            'data' => ['user' => $this->payload($user)],
        ], 201);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        if ($request->user()->is($user) && (
            ($request->has('role') && $request->validated('role') !== 'admin') ||
            ($request->has('is_active') && ! $request->boolean('is_active'))
        )) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menurunkan role atau menonaktifkan akun sendiri.',
            ], 422);
        }

        $after = DB::transaction(function () use ($request, $user) {
            $user = User::query()->lockForUpdate()->findOrFail($user->id);
            $before = $this->payload($user);
            $user->fill($request->validated())->save();
            if (! $user->is_active || $request->has('password')) {
                $user->tokens()->delete();
            }
            $after = $this->payload($user->fresh());
            $this->audit->record($request, 'user.updated', $user, $before, $after);

            return $after;
        });

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil diperbarui.',
            'data' => ['user' => $after],
        ]);
    }

    private function payload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'is_active' => $user->is_active,
            'email_verified' => $user->email_verified_at !== null,
            'applications_count' => $user->applications_count ?? $user->applications()->count(),
            'created_at' => $user->created_at?->toISOString(),
        ];
    }
}