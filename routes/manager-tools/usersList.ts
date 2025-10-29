// [GOV][MANAGER][USERS-LIST][USERS-001][v3.0][LIVE]
// Grepable: [gov-manager-users-list-users-001-v3.0-live]
// routes/manager-tools/usersList.ts - Users and agents management endpoint
// 🛡️ **Maintainers**: @syndicate-gov/manager-team
// 🎯 **Semantic Tag**: 🟢 [GOV][MANAGER][USERS-LIST][TYPESCRIPT]
// 📊 **Coverage**: User and agent listing with filtering capabilities

import { z } from 'zod';

// Request parameters schema
const UsersListParamsSchema = z.object({
  includeSubAgents: z.coerce.boolean().optional().default(false),
  agentNames: z.string().optional(),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(50),
  role: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional()
});

// User schema
const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email(),
  role: z.string(),
  status: z.string(),
  agentId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
  lastLogin: z.string().datetime().optional(),
  permissions: z.array(z.string()),
  metadata: z.object({
    totalBets: z.number().optional(),
    totalVolume: z.number().optional(),
    commissionRate: z.number().optional()
  }).optional()
});

// Response schema
const UsersListResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    users: z.array(UserSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number()
    }),
    filters: z.object({
      includeSubAgents: z.boolean(),
      agentNames: z.string().optional(),
      role: z.string().optional(),
      status: z.string().optional()
    })
  }),
  timestamp: z.string().datetime()
});

type UsersListParams = z.infer<typeof UsersListParamsSchema>;
type UsersListResponse = z.infer<typeof UsersListResponseSchema>;

export const handle = async (req: Request, { query }: { query: Record<string, string> }) => {
  try {
    // Validate query parameters
    const params = UsersListParamsSchema.parse(query);
    
    // Mock user data generation
    const mockUsers = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        username: 'nolarose',
        email: 'nolarose@syndicate.gov',
        role: 'manager',
        status: 'active',
        agentId: undefined,
        createdAt: '2024-01-15T10:30:00Z',
        lastLogin: new Date().toISOString(),
        permissions: ['read:users', 'write:reports', 'admin:tools'],
        metadata: {
          totalBets: 1250,
          totalVolume: 250000,
          commissionRate: 0.05
        }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        username: 'agent_smith',
        email: 'agent.smith@syndicate.gov',
        role: 'agent',
        status: 'active',
        agentId: '550e8400-e29b-41d4-a716-446655440001',
        createdAt: '2024-02-20T14:15:00Z',
        lastLogin: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        permissions: ['read:clients', 'write:bets'],
        metadata: {
          totalBets: 850,
          totalVolume: 125000,
          commissionRate: 0.03
        }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        username: 'jane_doe',
        email: 'jane.doe@syndicate.gov',
        role: 'agent',
        status: 'inactive',
        agentId: '550e8400-e29b-41d4-a716-446655440001',
        createdAt: '2024-03-10T09:45:00Z',
        lastLogin: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
        permissions: ['read:clients'],
        metadata: {
          totalBets: 320,
          totalVolume: 45000,
          commissionRate: 0.02
        }
      }
    ];

    // Filter users based on parameters
    let filteredUsers = mockUsers;
    
    if (params.agentNames) {
      filteredUsers = filteredUsers.filter(user => 
        user.username.toLowerCase().includes(params.agentNames!.toLowerCase())
      );
    }
    
    if (!params.includeSubAgents) {
      filteredUsers = filteredUsers.filter(user => !user.agentId);
    }
    
    if (params.role) {
      filteredUsers = filteredUsers.filter(user => user.role === params.role);
    }
    
    if (params.status) {
      filteredUsers = filteredUsers.filter(user => user.status === params.status);
    }

    // Pagination
    const startIndex = (params.page - 1) * params.limit;
    const endIndex = startIndex + params.limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    const response: UsersListResponse = {
      success: true,
      data: {
        users: paginatedUsers,
        pagination: {
          page: params.page,
          limit: params.limit,
          total: filteredUsers.length,
          totalPages: Math.ceil(filteredUsers.length / params.limit)
        },
        filters: {
          includeSubAgents: params.includeSubAgents,
          agentNames: params.agentNames,
          role: params.role,
          status: params.status
        }
      },
      timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Users-Count': filteredUsers.length.toString(),
        'X-Page-Count': Math.ceil(filteredUsers.length / params.limit).toString(),
        'Cache-Control': 'private, max-age=60' // 1 minute cache
      }
    });
    
  } catch (error) {
    const errorResponse = {
      success: false,
      message: 'Failed to fetch users list',
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Users-Error': 'true'
      }
    });
  }
};
