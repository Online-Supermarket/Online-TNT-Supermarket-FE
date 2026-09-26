import React from 'react';
import { ManageOrders } from '../admin/ManageOrders';

// Staff and Operations Admin intentionally share one fulfillment pipeline.
// The API authorizes both roles for operational order actions.
export const StaffOrders = () => <ManageOrders />;
