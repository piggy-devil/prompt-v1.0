"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { useRouter } from "next/navigation";

const schema = z.object({
  employeeId: z.string().regex(/^\d{8}$/, "Employee ID must be 8 digits"),
});

type FormData = z.infer<typeof schema>;

export const SetupEmployeeIdForm = () => {
  const router = useRouter();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    const res = await fetch("/api/set-employee-id", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/profile");
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-sm space-y-4"
      >
        <FormField
          control={form.control}
          name="employeeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employee ID</FormLabel>
              <FormControl>
                <Input placeholder="8-digit ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Save</Button>
      </form>
    </Form>
  );
};
