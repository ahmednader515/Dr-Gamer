import { Metadata } from 'next'
import Link from 'next/link'

import { auth } from '@/auth'
import { getAllUsers } from '@/lib/actions/user.actions'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime } from '@/lib/utils'
import ServerPagination from '@/components/shared/server-pagination'
import UsersSearch from './users-search'

export const metadata: Metadata = {
  title: 'Admin Users',
}

export default async function AdminUser(props: {
  searchParams: Promise<{ page: string; search?: string }>
}) {
  const searchParams = await props.searchParams
  const { page = '1', search = '' } = searchParams
  
  const session = await auth()
  if (session?.user.role !== 'Admin')
    throw new Error('Admin permission required')
    
  const users = await getAllUsers({
    page: Number(page),
    search: search || undefined,
  })
  
  return (
    <div className='space-y-4 ltr text-left' style={{ fontFamily: 'Cairo, sans-serif' }}>
      <h1 className='h1-bold'>Users</h1>
      
      {/* Search Box */}
      <UsersSearch initialSearch={search} />
      
      {/* Desktop Table - Hidden on mobile */}
      <div className='hidden md:block overflow-x-auto'>
        <Table className="admin-table border border-gray-300 rounded-lg overflow-hidden shadow-lg">
          <TableHeader>
            <TableRow className="bg-gray-100 border-b-2 border-gray-300">
              <TableHead className='text-left bg-gray-100 text-gray-800 font-semibold py-4 px-4'>Name</TableHead>
              <TableHead className='text-left bg-gray-100 text-gray-800 font-semibold py-4 px-4'>Email</TableHead>
              <TableHead className='text-left bg-gray-100 text-gray-800 font-semibold py-4 px-4'>Role</TableHead>
              <TableHead className='text-left bg-gray-100 text-gray-800 font-semibold py-4 px-4'>Registered</TableHead>
              <TableHead className='text-left bg-gray-100 text-gray-800 font-semibold py-4 px-4'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.data && users.data.length > 0 ? (
              users.data.map((user) => (
              <TableRow key={user.id} className="bg-gray-800 hover:bg-gray-700 border-b border-gray-700">
                <TableCell className='text-left py-4 px-4'>
                  <div>
                    <div className='font-medium'>{user.name}</div>
                    {user.email && (
                      <div className='text-sm text-gray-500'>{user.email}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell className='text-left py-4 px-4'>
                  {user.email || 'Not available'}
                </TableCell>
                <TableCell className='text-left py-4 px-4'>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'Admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : user.role === 'Moderator'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                  }`}>
                    {user.role === 'Admin' ? 'Admin' : user.role === 'Moderator' ? 'Moderator' : 'User'}
                  </span>
                </TableCell>
                <TableCell className='text-left py-4 px-4'>
                  {formatDateTime(user.createdAt).dateTime}
                </TableCell>
                <TableCell className='text-left py-4 px-4'>
                  <Button asChild size='sm'>
                    <Link href={`/admin/users/${user.id}`}>
                      Edit
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className='text-center py-8 text-gray-400'>
                  {search ? `No users found matching "${search}"` : 'No users found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards - Visible only on mobile */}
      <div className='md:hidden space-y-4'>
        {users?.data && users.data.length > 0 ? (
          users.data.map((user) => (
          <div key={user.id} className="bg-gray-800 border border-gray-700 rounded-lg shadow-sm p-4 space-y-3">
            {/* User Header */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-lg text-white">{user.name}</div>
                {user.email && (
                  <div className="text-sm text-gray-400">{user.email}</div>
                )}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                user.role === 'Admin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : user.role === 'Moderator'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-purple-100 text-purple-800'
              }`}>
                {user.role === 'Admin' ? 'Admin' : user.role === 'Moderator' ? 'Moderator' : 'User'}
              </span>
            </div>

            {/* Registration Date */}
            <div className="border-t border-gray-700 pt-3">
              <div className="text-sm text-gray-400 mb-1">Registered:</div>
              <div className="text-sm text-white">
                {formatDateTime(user.createdAt).dateTime}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-700 pt-3">
              <Button asChild size='sm' className="w-full">
                <Link href={`/admin/users/${user.id}`}>
                  Edit
                </Link>
              </Button>
            </div>
          </div>
          ))
        ) : (
          <div className='text-center py-8 text-gray-400'>
            {search ? `No users found matching "${search}"` : 'No users found'}
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {users?.totalPages && users.totalPages > 1 && (
        <div className='flex justify-center pt-4'>
          <ServerPagination
            currentPage={Number(page)}
            totalPages={users.totalPages}
            baseUrl='/admin/users'
            searchParams={search ? { search } : {}}
          />
        </div>
      )}
    </div>
  )
}
