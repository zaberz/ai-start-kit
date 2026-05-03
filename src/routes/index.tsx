import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getSession();
    console.log(1111, data);
    
    // if (error || !data.session) {
    //   throw redirect({ to: "/login" });
    // }
    // throw redirect({ to: "/ficus/dashboard" });
  },
});
