import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

export default function ChooseRoleRedirectPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	const query = new URLSearchParams();

	Object.entries(searchParams).forEach(([key, value]) => {
		if (typeof value === "string") {
			query.set(key, value);
		} else if (Array.isArray(value) && value.length > 0) {
			query.set(key, value[0]);
		}
	});

	const qs = query.toString();
	redirect(qs ? `/select-role?${qs}` : "/select-role");
}
