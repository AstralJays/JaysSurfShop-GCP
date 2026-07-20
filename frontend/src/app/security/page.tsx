import { redirect } from "next/navigation";

/** Legacy presenter URL — labs replace the auto PoC center. */
export default function SecurityRedirect() {
  redirect("/labs");
}
