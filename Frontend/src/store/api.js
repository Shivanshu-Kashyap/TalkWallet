import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['User', 'Group', 'Message', 'Heading'],
  endpoints: (builder) => ({
    // Auth endpoints
    startOTP: builder.mutation({
      query: (phoneData) => ({
        url: '/auth/otp/start',
        method: 'POST',
        body: phoneData,
      }),
    }),
    verifyOTP: builder.mutation({
      query: (otpData) => ({
        url: '/auth/otp/verify',
        method: 'POST',
        body: otpData,
      }),
    }),
    getProfile: builder.query({
      query: () => '/auth/profile',
      providesTags: ['User'],
    }),
    
    // Group endpoints
    createGroup: builder.mutation({
      query: (groupData) => ({
        url: '/groups',
        method: 'POST',
        body: groupData,
      }),
      invalidatesTags: ['Group'],
    }),
    getUserGroups: builder.query({
      query: () => '/groups',
      providesTags: ['Group'],
    }),
    addMember: builder.mutation({
      query: ({ groupId, phoneData }) => ({
        url: `/groups/${groupId}/members`,
        method: 'POST',
        body: phoneData,
      }),
      invalidatesTags: ['Group'],
    }),
    getGroupMembers: builder.query({
      query: (groupId) => `/groups/${groupId}/members`,
      providesTags: ['Group'],
    }),
    
    // Message endpoints
    getMessages: builder.query({
      query: ({ groupId, page = 1, limit = 50 }) => 
        `/groups/${groupId}/messages?page=${page}&limit=${limit}`,
      providesTags: ['Message'],
    }),
    
    // Heading endpoints
    createHeading: builder.mutation({
      query: ({ groupId, headingData }) => ({
        url: `/groups/${groupId}/headings`,
        method: 'POST',
        body: headingData,
      }),
      invalidatesTags: ['Heading'],
    }),
    getActiveHeading: builder.query({
      query: (groupId) => `/groups/${groupId}/headings/active`,
      providesTags: ['Heading'],
    }),
  }),
});

export const {
  useStartOTPMutation,
  useVerifyOTPMutation,
  useGetProfileQuery,
  useCreateGroupMutation,
  useGetUserGroupsQuery,
  useAddMemberMutation,
  useGetGroupMembersQuery,
  useGetMessagesQuery,
  useCreateHeadingMutation,
  useGetActiveHeadingQuery,
} = api;
