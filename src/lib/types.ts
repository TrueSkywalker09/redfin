export interface Profile {
  id: string
  household_id: string | null
  full_name: string | null
  avatar_url: string | null
}

export interface Household {
  id: string
  name: string
  created_at: string
}

export interface Category {
  id: string
  household_id: string
  name: string
  type: 'income' | 'expense' | 'both'
  color: string | null
  icon: string | null
}

export interface Transaction {
  id: string
  household_id: string
  created_by: string
  type: 'income' | 'expense'
  amount: number
  description: string | null
  category_id: string | null
  date: string
  is_recurring: boolean
  recurrence: 'weekly' | 'monthly' | 'yearly' | null
  created_at: string
  bank_account_id: string | null
  installment_id: string | null
}

export interface FixedBill {
  id: string
  household_id: string
  name: string
  amount: number
  due_day: number
  category_id: string | null
  is_active: boolean
  start_date: string | null
}

export interface FixedBillPayment {
  id: string
  fixed_bill_id: string
  household_id: string | null
  reference_month: string
  paid_at: string | null
  transaction_id: string | null
}

export interface CreditCard {
  id: string
  household_id: string
  name: string
  credit_limit: number | null
  closing_day: number | null
  due_day: number | null
  color: string | null
}

export interface BankAccount {
  id: string
  household_id: string
  name: string
  bank_name: string | null
  account_type: 'checking' | 'savings' | 'investment' | null
  account_number: string | null
  agency_number: string | null
  color: string
  current_balance: number
  created_at: string
  updated_at: string
}

export interface Installment {
  id: string
  household_id: string
  card_id: string
  description: string
  total_amount: number
  total_installments: number
  current_installment: number
  first_charge_date: string
  category_id: string | null
}

export interface Project {
  id: string
  household_id: string
  name: string
  description: string | null
  target_amount: number
  current_amount: number
  target_date: string | null
  priority: 'low' | 'medium' | 'high'
  status: 'active' | 'paused' | 'completed'
  created_at: string
}

export interface ProjectContribution {
  id: string
  project_id: string
  amount: number
  note: string | null
  contributed_at: string
}
