import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Users, Search, ShieldCheck, ShieldOff, Dog, MessageSquare,
  Eye, EyeOff, TrendingUp, ChevronLeft, ChevronRight, Ban,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface AdminUser {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  is_public: boolean;
  onboarding_completed: boolean | null;
  created_at: string;
  updated_at: string | null;
  posts_count: number;
  dogs_count: number;
  is_admin: boolean;
}

interface UserBlock {
  id: string;
  blocker_id: string;
  blocked_id: string;
  reason: string | null;
  created_at: string;
}

const PAGE_SIZE = 20;

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Fetch all users via RPC
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_users');
      if (error) throw error;
      return (data ?? []) as AdminUser[];
    },
  });

  // Fetch blocks for selected user
  const { data: blocks = [], isLoading: blocksLoading } = useQuery({
    queryKey: ['admin-user-blocks', selectedUser?.id],
    enabled: !!selectedUser,
    queryFn: async () => {
      if (!selectedUser) return [];
      const { data, error } = await supabase
        .from('user_blocks')
        .select('*')
        .or(`blocker_id.eq.${selectedUser.id},blocked_id.eq.${selectedUser.id}`);
      if (error) throw error;
      return (data ?? []) as UserBlock[];
    },
  });

  // Toggle admin mutation
  const toggleAdmin = useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => {
      if (makeAdmin) {
        const { error } = await supabase.from('admin_users').insert({ user_id: userId });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('admin_users').delete().eq('user_id', userId);
        if (error) throw error;
      }
    },
    onSuccess: (_, { makeAdmin }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: makeAdmin ? 'Admin granted' : 'Admin revoked',
        description: makeAdmin
          ? 'User now has admin access.'
          : 'User no longer has admin access.',
      });
      if (selectedUser) {
        setSelectedUser({ ...selectedUser, is_admin: !selectedUser.is_admin });
      }
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  // Filter + paginate
  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.display_name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.city?.toLowerCase().includes(q) ||
        u.state?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const newThisWeek = useMemo(() => {
    const cutoff = subDays(new Date(), 7).toISOString();
    return users.filter((u) => u.created_at >= cutoff).length;
  }, [users]);

  const initials = (u: AdminUser) =>
    (u.display_name || u.username || '?').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Search, inspect, and moderate user accounts</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-7 w-12 inline-block" /> : users.length}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <span className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-7 w-12 inline-block" /> : newThisWeek}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, username, or location…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="pl-10"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden sm:table-cell">Location</TableHead>
                  <TableHead className="text-center">
                    <Dog className="h-4 w-4 mx-auto" />
                  </TableHead>
                  <TableHead className="text-center">
                    <MessageSquare className="h-4 w-4 mx-auto" />
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden md:table-cell">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {search ? 'No users match your search.' : 'No users found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((user) => (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">{initials(user)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-sm truncate">
                                {user.display_name || 'No name'}
                              </span>
                              {user.is_admin && (
                                <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                              )}
                            </div>
                            {user.username && (
                              <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {[user.city, user.state].filter(Boolean).join(', ') || '—'}
                      </TableCell>
                      <TableCell className="text-center text-sm">{user.dogs_count}</TableCell>
                      <TableCell className="text-center text-sm">{user.posts_count}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {user.is_public ? (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <Eye className="h-3 w-3" /> Public
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <EyeOff className="h-3 w-3" /> Private
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filtered.length} user{filtered.length !== 1 ? 's' : ''} · Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* User detail drawer */}
      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent className="overflow-y-auto">
          {selectedUser && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedUser.avatar_url || undefined} />
                    <AvatarFallback>{initials(selectedUser)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      {selectedUser.display_name || 'No name'}
                      {selectedUser.is_admin && <ShieldCheck className="h-4 w-4 text-primary" />}
                    </div>
                    {selectedUser.username && (
                      <p className="text-sm font-normal text-muted-foreground">@{selectedUser.username}</p>
                    )}
                  </div>
                </SheetTitle>
                <SheetDescription>
                  Joined {format(new Date(selectedUser.created_at), 'MMMM d, yyyy')}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Profile info */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Profile</h3>
                  {selectedUser.bio && <p className="text-sm">{selectedUser.bio}</p>}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Location</span>
                      <p className="font-medium">
                        {[selectedUser.city, selectedUser.state].filter(Boolean).join(', ') || '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Visibility</span>
                      <p className="font-medium">{selectedUser.is_public ? 'Public' : 'Private'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Dogs</span>
                      <p className="font-medium">{selectedUser.dogs_count}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Posts</span>
                      <p className="font-medium">{selectedUser.posts_count}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Onboarding</span>
                      <p className="font-medium">
                        {selectedUser.onboarding_completed ? 'Complete' : 'Incomplete'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Blocks section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Ban className="h-4 w-4" /> Blocks
                  </h3>
                  {blocksLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : blocks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No block records.</p>
                  ) : (
                    <div className="space-y-2">
                      {blocks.map((b) => (
                        <div key={b.id} className="flex items-center justify-between text-sm rounded-lg border p-3">
                          <div>
                            <span className="font-medium">
                              {b.blocker_id === selectedUser.id ? 'Blocked' : 'Blocked by'}
                            </span>
                            <p className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">
                              {b.blocker_id === selectedUser.id ? b.blocked_id : b.blocker_id}
                            </p>
                          </div>
                          {b.reason && (
                            <Badge variant="outline" className="text-xs">{b.reason}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Actions</h3>
                  <Button
                    variant={selectedUser.is_admin ? 'destructive' : 'default'}
                    className="w-full gap-2"
                    onClick={() =>
                      toggleAdmin.mutate({
                        userId: selectedUser.id,
                        makeAdmin: !selectedUser.is_admin,
                      })
                    }
                    disabled={toggleAdmin.isPending}
                  >
                    {selectedUser.is_admin ? (
                      <>
                        <ShieldOff className="h-4 w-4" /> Revoke Admin
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" /> Grant Admin
                      </>
                    )}
                  </Button>
                </div>

                {/* User ID */}
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">User ID</p>
                  <p className="text-xs font-mono break-all">{selectedUser.id}</p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
