import { redirect } from "next/navigation";

export default async function ReviewNaskahAlias({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	redirect(`/dashboard/review-naskah/${id}`);
}