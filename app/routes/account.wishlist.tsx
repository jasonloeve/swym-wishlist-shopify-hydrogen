import type {Route} from './+types/account.wishlist';
import {Wishlist} from "~/services/swym/components/wishlist/Wishlist";

export const meta: Route.MetaFunction = () => {
  return [{title: 'Wishlist'}];
};

export async function loader({context}: Route.LoaderArgs) {
  context.customerAccount.handleAuthStatus();

  return {};
}

export default function AccountProfile() {
  return (
    <div className="account-wishlist">
      <Wishlist />
    </div>
  );
}
