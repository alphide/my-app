import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Create a Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the schema information for the users table
    const { data: columns, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Look for a row to understand the schema
    let schema = {};
    if (columns && columns.length > 0) {
      schema = columns[0];
    }
    
    // Try to get the column information through Postgres introspection
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('debug_get_table_info', { table_name: 'users' })
      .select('*');
    
    if (tableError) {
      // If RPC function doesn't exist, just send what we have
      console.log("RPC debug function not available:", tableError);
      return NextResponse.json({
        message: 'Schema introspection - limited info available',
        schema_from_sample_row: schema,
        columns: Object.keys(schema)
      });
    }
    
    return NextResponse.json({
      message: 'Schema introspection',
      schema_from_sample_row: schema,
      columns: Object.keys(schema),
      detailed_schema: tableInfo
    });
  } catch (error: any) {
    console.error('Error in debug-schema endpoint:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 