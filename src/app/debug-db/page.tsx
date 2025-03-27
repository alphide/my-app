'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugSchema() {
  const [schema, setSchema] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSchema() {
      try {
        // Fetch a row from the users table to understand schema
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .limit(1)

        if (usersError) {
          throw new Error(`Error fetching users: ${usersError.message}`)
        }

        // Fetch schema info from auth table
        const { data: authData, error: authError } = await supabase
          .from('users')
          .select('id, email, role, password_hash, created_at')
          .limit(1)

        if (authError) {
          console.error('Auth data error:', authError)
        }

        // Get raw SQL structure
        const { data: sqlInfo, error: sqlError } = await supabase
          .rpc('get_table_info', { table_name: 'users' })
          .select('*')

        // Create the full schema object
        const schemaInfo = {
          users: {
            sample: usersData && usersData.length > 0 ? usersData[0] : null,
            columns: usersData && usersData.length > 0 ? Object.keys(usersData[0]) : [],
            auth_data: authData || [],
            sql_info: sqlInfo || [],
          }
        }

        setSchema(schemaInfo)
      } catch (err: any) {
        console.error('Error fetching schema:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSchema()
  }, [])

  if (loading) {
    return <div className="p-8">Loading schema information...</div>
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Database Schema Debug</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Users Table</h2>
        {schema?.users?.sample ? (
          <>
            <div className="bg-gray-100 p-4 rounded overflow-auto mb-4">
              <pre>{JSON.stringify(schema.users.sample, null, 2)}</pre>
            </div>
            
            <h3 className="font-semibold mt-4 mb-2">Columns:</h3>
            <ul className="list-disc pl-6 mb-4">
              {schema.users.columns.map((col: string) => (
                <li key={col}>{col}</li>
              ))}
            </ul>
          </>
        ) : (
          <p>No data found in users table</p>
        )}
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Auth Data</h2>
        {schema?.users?.auth_data.length > 0 ? (
          <div className="bg-gray-100 p-4 rounded overflow-auto">
            <pre>{JSON.stringify(schema.users.auth_data, null, 2)}</pre>
          </div>
        ) : (
          <p>No auth data available</p>
        )}
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">SQL Table Info</h2>
        {schema?.users?.sql_info && schema.users.sql_info.length > 0 ? (
          <div className="bg-gray-100 p-4 rounded overflow-auto">
            <pre>{JSON.stringify(schema.users.sql_info, null, 2)}</pre>
          </div>
        ) : (
          <p>SQL info not available</p>
        )}
      </div>
    </div>
  )
} 