import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const USER_CHATS_KEY = "/api/prompt-chat/list";

export function useUserChats() {
  const { data, error, isLoading, mutate } = useSWR(USER_CHATS_KEY, fetcher);

  return {
    chats: data ?? [],
    isLoading,
    isError: error,
    mutate,
  };
}
