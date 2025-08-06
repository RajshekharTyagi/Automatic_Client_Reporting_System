import React, { useState, useEffect } from 'react'
import { Users, Shield, User } from 'lucide-react'
import { supabase } from '../lib/supabase'

const AdminPanel = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
      await fetchUsers()
    } catch (error) {
      console.error('Error updating user role:', error)
    }
  }

  if (loading) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Panel</h2>
        <div className="loading-spinner mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
        <Shield className="h-5 w-5" />
        <span>Admin Panel - User Management</span>
      </h2>
      
      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <User className="h-8 w-8 text-gray-400" />
              <div>
                <h3 className="font-medium text-gray-900">{user.full_name}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            
            <select
              value={user.role}
              onChange={(e) => updateUserRole(user.id, e.target.value)}
              className="input-field w-32"
            >
              <option value="client">Client</option>
              <option value="intern">Intern</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminPanel