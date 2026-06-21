export interface Business {
  id?: string;
  owner_id?: string;
  business_name: string;
  category: string;
  phone_number: string;
  address: string;
  logo_url: string | null;
  subscription_plan?: string;
  created_at?: string;
}
