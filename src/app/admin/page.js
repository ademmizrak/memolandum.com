import AdminClient from "./AdminClient";

export const metadata = {
  title: "Yönetici & Veli İletişim Merkezi",
  alternates: {
    canonical: "https://memolandum.com/admin/",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return <AdminClient />;
}
