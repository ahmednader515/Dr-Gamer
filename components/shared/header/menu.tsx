import CartButton from './cart-button'
import UserButton from './user-button'
import { auth } from '@/auth'

const Menu = async ({ forAdmin = false }: { forAdmin?: boolean }) => {
  const session = await auth()

  return (
    <div className='flex justify-end'>
      <nav className='md:flex gap-3 hidden w-full'>
        <UserButton 
          session={session} 
          translations={{
            hello: 'مرحباً',
            signIn: 'تسجيل الدخول',
            accountOrders: 'الحساب والطلبات',
            yourAccount: 'حسابك',
            yourOrders: 'طلباتك',
            admin: 'المدير',
            signOut: 'تسجيل الخروج',
            newCustomer: 'عميل جديد',
            signUp: 'إنشاء حساب'
          }} 
        />
        {forAdmin ? null : <CartButton />}
      </nav>
      {/* Mobile 3 dots menu removed - using hamburger menu only */}
    </div>
  )
}

export default Menu
