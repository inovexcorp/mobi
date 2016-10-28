package org.matonto.jaas.api.engines;

import java.util.Set;

public class GroupConfig {
    private String title;
    private String description = "";
    private Set<String> members = null;
    private Set<String> roles = null;

    private GroupConfig(Builder builder) {
        title = builder.title;
        description = builder.description;
        members = builder.members;
        roles = builder.roles;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public Set<String> getMembers() {
        return members;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public static class Builder {
        private final String title;
        private String description = "";
        private Set<String> members = null;
        private Set<String> roles = null;

        public Builder(String title) {
            this.title = title;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder members(Set<String> members) {
            this.members = members;
            return this;
        }

        public Builder roles(Set<String> roles) {
            this.roles = roles;
            return this;
        }

        public GroupConfig build() {
            return new GroupConfig(this);
        }
    }
}
