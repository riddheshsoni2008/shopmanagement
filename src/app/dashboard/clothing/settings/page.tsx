import { getShopProfile } from "@/actions/settings";
import { OrderSettings } from "@/components/orders/order-settings";

export const revalidate = 0;

export default async function ClothingSettingsPage() {
  const res = await getShopProfile();

  const profile =
    res.success && res.data
      ? res.data
      : {
          shopName: "Clothing Shop",
          name: "",
          email: "",
          businessCategory: "clothing",
        };

  return <OrderSettings category="clothing" profile={profile} />;
}

