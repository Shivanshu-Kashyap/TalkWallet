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

    // order api
    getOrderItems: builder.query({
      query: (headingId) => `/headings/${headingId}/orders`,
      providesTags: ['OrderItem'],
    }),
    deleteOrderItem: builder.mutation({
      query: (itemId) => ({
        url: `/orders/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['OrderItem'],
    }),
    addItemPrice: builder.mutation({
  query: ({ itemId, price }) => ({
    url: `/items/${itemId}/price`,
    method: 'POST',
    body: { price },
  }),
  invalidatesTags: ['OrderItem'],
}),
assignPayers: builder.mutation({
  query: ({ itemId, payers }) => ({
    url: `/items/${itemId}/payers`,
    method: 'POST',
    body: { payers },
  }),
  invalidatesTags: ['OrderItem'],
}),
uploadReceipt: builder.mutation({
  query: ({ headingId, formData }) => ({
    url: `/headings/${headingId}/receipts`,
    method: 'POST',
    body: formData,
  }),
  invalidatesTags: ['Receipt'],
}),
getReceipts: builder.query({
  query: (headingId) => `/headings/${headingId}/receipts`,
  providesTags: ['Receipt'],
}),
confirmMapping: builder.mutation({
  query: ({ mappingId, confirmed, customPrice }) => ({
    url: `/receipts/mappings/${mappingId}/confirm`,
    method: 'POST',
    body: { confirmed, customPrice },
  }),
  invalidatesTags: ['OrderItem', 'Receipt'],
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
  useGetOrderItemsQuery,         
  useDeleteOrderItemMutation,
  useAddItemPriceMutation,
  useAssignPayersMutation,
  useUploadReceiptMutation,
  useGetReceiptsQuery,
  useConfirmMappingMutation,   
} = api;
