CREATE POLICY "Admins can grant admin"
  ON admin_users FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can revoke admin"
  ON admin_users FOR DELETE TO authenticated
  USING (is_admin());