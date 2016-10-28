package org.matonto.jaas.api.engines;

import java.util.Set;

public class UserConfig {
    private String username;
    private String password;
    private Set<String> roles;
    private String email = "";
    private String firstName = "";
    private String lastName = "";

    private UserConfig(Builder builder) {
        username = builder.username;
        password = builder.password;
        roles = builder.roles;
        email = builder.email;
        firstName = builder.firstName;
        lastName = builder.lastName;
    }

    public String getUsername() {
        return username;
    }

    public String getPassword() {
        return password;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public String getEmail() {
        return email;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public static class Builder {
        private final String username;
        private final String password;
        private final Set<String> roles;
        private String email = "";
        private String firstName = "";
        private String lastName = "";

        public Builder(String username, String password, Set<String> roles) {
            this.username = username;
            this.password = password;
            this.roles = roles;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }

        public Builder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }

        public UserConfig build() {
            return new UserConfig(this);
        }
    }
}
