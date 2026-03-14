import PolicyDesigner from "@/components/policies/policy-designer";
import PolicyList from "@/components/policies/policy-list";

export default function PoliciesPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Proactive Policy Management</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <PolicyList />
        </div>
        <div className="lg:col-span-1">
          <PolicyDesigner />
        </div>
      </div>
    </div>
  );
}
