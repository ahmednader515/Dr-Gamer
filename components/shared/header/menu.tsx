import CartButton from './cart-button'
import UserButton from './user-button'
import FavoritesButton from './favorites-button'
import { auth } from '@/auth'

const Menu = async ({ forAdmin = false }: { forAdmin?: boolean }) => {
  const session = await auth()

  return (
    <div className='flex justify-end'>
      <nav className='md:flex gap-2 md:gap-3 lg:gap-4 hidden w-full'>
        <UserButton 
          session={session} 
          translations={{
            hello: 'Hello',
            signIn: 'Sign In',
            accountOrders: 'Account & Orders',
            yourAccount: 'Your Account',
            yourOrders: 'Your Orders',
            admin: 'Admin',
            signOut: 'Sign Out',
            newCustomer: 'New Customer',
            signUp: 'Sign Up'
          }} 
        />
        {forAdmin ? null : (
          <>
            <FavoritesButton />
            <CartButton />
          </>
        )}
      </nav>
      {/* Mobile 3 dots menu removed - using hamburger menu only */}
    </div>
  )
}

export default Menu
