import OrderDetailPage from "."

interface PageProps {
    params: Promise<{ _id: string }>;
    searchParams: Promise<{ isSeller?: string }>;
}

export default async function PageOrder(props: PageProps) {
    const searchParams = await props.searchParams;
    const params = await props.params;
    const isSeller = searchParams?.isSeller === 'true';
    return (
        <OrderDetailPage id={params._id} isSellerView={isSeller} />
    )
}