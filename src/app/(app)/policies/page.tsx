import ConfigPolicyForm from "@/components/policies/config-policy-form";
import PolicyDesigner from "@/components/policies/policy-designer";
import PolicyList from "@/components/policies/policy-list";

export default function PoliciesPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-1">
        <PolicyDesigner />
      </div>
      <div className="lg:col-span-2 grid gap-8">
        <ConfigPolicyForm />
        <PolicyList />
      </div>
    </div>
  );
}
