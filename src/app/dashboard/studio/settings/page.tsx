import { getShopProfile } from "@/actions/settings";
import { OrderSettings } from "@/components/orders/order-settings";

export const revalidate = 0;

export default async function StudioSettingsPage() {
  const res = await getShopProfile();

  const profile =
    res.success && res.data
      ? res.data
      : {
          shopName: "Camera Studio",
          name: "",
          email: "",
          businessCategory: "studio",
        };

  return <OrderSettings category="studio" profile={profile} />;
}

