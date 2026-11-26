-- funções de trigger não devem ser chamáveis via /rpc (advisor 0029)
revoke execute on function public.handle_new_user(), public.validate_avatar() from authenticated, anon, public;
