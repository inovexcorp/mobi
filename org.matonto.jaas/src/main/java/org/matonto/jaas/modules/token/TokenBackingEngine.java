package org.matonto.jaas.modules.token;

/*-
 * #%L
 * org.matonto.jaas
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import org.apache.karaf.jaas.boot.principal.GroupPrincipal;
import org.apache.karaf.jaas.boot.principal.RolePrincipal;
import org.apache.karaf.jaas.boot.principal.UserPrincipal;
import org.apache.karaf.jaas.modules.BackingEngine;
import org.apache.karaf.jaas.modules.encryption.EncryptionSupport;
import org.apache.log4j.Logger;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.security.Principal;
import java.util.*;

/**
 * BackingEngine for TokenLoginModule. Adapted from Karaf PropertiesBackingEngine.
 */
public class TokenBackingEngine implements BackingEngine {

    private static final Logger LOG = Logger.getLogger(TokenBackingEngine.class.getName());

    private String usersFileString;
    private Properties users = new Properties();
    private EncryptionSupport encryptionSupport;

    public TokenBackingEngine(String usersFileString) {
        this.usersFileString = usersFileString;
        try {
            users.load(new FileInputStream(usersFileString));
        } catch (IOException e) {
            LOG.warn("Cannot open users file: " + usersFileString);
        }
    }

    public TokenBackingEngine(String usersFileString, EncryptionSupport encryptionSupport) {
        this.usersFileString = usersFileString;
        this.encryptionSupport = encryptionSupport;
        try {
            users.load(new FileInputStream(usersFileString));
        } catch (IOException e) {
            LOG.warn("Cannot open users file: " + usersFileString);
        }
    }

    @Override
    public void addUser(String username, String password) {
        if (username.startsWith(GROUP_PREFIX)) {
            throw new IllegalArgumentException("Prefix not permitted: " + GROUP_PREFIX);
        }

        addUserInternal(username, password);
    }

    private void addUserInternal(String username, String password) {
        String[] infos;
        StringBuilder userInfoBuffer = new StringBuilder();

        String newPassword = password;

        //If encryption support is enabled, encrypt password
        if (encryptionSupport != null && encryptionSupport.getEncryption() != null) {
            newPassword = encryptionSupport.getEncryption().encryptPassword(password);
            if (encryptionSupport.getEncryptionPrefix() != null) {
                newPassword = encryptionSupport.getEncryptionPrefix() + newPassword;
            }
            if (encryptionSupport.getEncryptionSuffix() != null) {
                newPassword = newPassword + encryptionSupport.getEncryptionSuffix();
            }
        }

        String userInfos = users.getProperty(username);

        //If user already exists, update password
        if (userInfos != null && userInfos.length() > 0) {
            infos = userInfos.split(",");
            userInfoBuffer.append(newPassword);

            for (int i = 1; i < infos.length; i++) {
                userInfoBuffer.append(",");
                userInfoBuffer.append(infos[i]);
            }
            String newUserInfo = userInfoBuffer.toString();
            users.put(username, newUserInfo);
        } else {
            users.put(username, newPassword);
        }

        try {
            users.store(new FileOutputStream(usersFileString), "");
        } catch (IOException ex) {
            LOG.error("Cannot update users file,", ex);
        }
    }

    @Override
    public void deleteUser(String username) {
        // delete all its groups first, for garbage collection of the groups
        for (GroupPrincipal gp : listGroups(username)) {
            deleteGroup(username, gp.getName());
        }

        users.remove(username);

        try {
            users.store(new FileOutputStream(usersFileString), "");
        } catch (IOException ex) {
            LOG.error("Cannot update users file,", ex);
        }
    }

    @Override
    public List<UserPrincipal> listUsers() {
        List<UserPrincipal> result = new ArrayList<>();

        for (Object user : users.keySet()) {
            String userName = (String) user;
            if (userName.startsWith(GROUP_PREFIX)) {
                continue;
            }

            UserPrincipal userPrincipal = new UserPrincipal(userName);
            result.add(userPrincipal);
        }
        return result;
    }

    @Override
    public List<RolePrincipal> listRoles(Principal principal) {
        String userName = principal.getName();
        if (principal instanceof  GroupPrincipal) {
            userName = GROUP_PREFIX + userName;
        }
        return listRoles(userName);
    }

    private List<RolePrincipal> listRoles(String name) {

        List<RolePrincipal> result = new ArrayList<>();
        String userInfo = users.getProperty(name);
        String[] infos = userInfo.split(",");
        for (int i = 1; i < infos.length; i++) {
            String roleName = infos[i];
            if (roleName.startsWith(GROUP_PREFIX)) {
                listRoles(roleName).stream()
                        .filter(rp -> !result.contains(rp))
                        .forEach(result::add);
            } else {
                RolePrincipal rp = new RolePrincipal(roleName);
                if (!result.contains(rp)) {
                    result.add(rp);
                }
            }
        }
        return result;
    }

    @Override
    public void addRole(String username, String role) {
        String userInfos = users.getProperty(username);
        if (userInfos != null) {
            for (RolePrincipal rp : listRoles(username)) {
                if (role.equals(rp.getName())) {
                    return;
                }
            }
            for (GroupPrincipal gp : listGroups(username)) {
                if (role.equals(GROUP_PREFIX + gp.getName())) {
                    return;
                }
            }
            String newUserInfos = userInfos + "," + role;
            users.put(username, newUserInfos);
        }
        try {
            users.store(new FileOutputStream(usersFileString), "");
        } catch (IOException ex) {
            LOG.error("Cannot update users file,", ex);
        }
    }

    @Override
    public void deleteRole(String username, String role) {
        String[] infos;
        StringBuilder userInfoBuffer = new StringBuilder();

        String userInfos = users.getProperty(username);

        //If user already exists, remove the role
        if (userInfos != null && userInfos.length() > 0) {
            infos = userInfos.split(",");
            String password = infos[0];
            userInfoBuffer.append(password);

            for (int i = 1; i < infos.length; i++) {
                if (infos[i] != null && !infos[i].equals(role)) {
                    userInfoBuffer.append(",");
                    userInfoBuffer.append(infos[i]);
                }
            }
            String newUserInfo = userInfoBuffer.toString();
            users.put(username, newUserInfo);
        } else {
            LOG.warn("Attempted to delete role from non-existent user, " + username);
        }

        try {
            users.store(new FileOutputStream(usersFileString), "");
        } catch (Exception ex) {
            LOG.error("Cannot update users file,", ex);
        }
    }

    @Override
    public List<GroupPrincipal> listGroups(UserPrincipal user) {
        String userName = user.getName();
        return listGroups(userName);
    }

    @Override
    public Map<GroupPrincipal, String> listGroups() {
        Map<GroupPrincipal, String> result = new HashMap<>();
        users.stringPropertyNames().stream()
                .filter(name -> name.startsWith(GROUP_PREFIX))
                .forEach(name ->
                        result.put(new GroupPrincipal(name.substring(GROUP_PREFIX.length())), users.getProperty(name)));
        return result;
    }

    private List<GroupPrincipal> listGroups(String userName) {
        List<GroupPrincipal> result = new ArrayList<>();
        String userInfo = users.getProperty(userName);
        if (userInfo != null) {
            String[] infos = userInfo.split(",");
            for (int i = 1; i < infos.length; i++) {
                String name = infos[i];
                if (name.startsWith(GROUP_PREFIX)) {
                    result.add(new GroupPrincipal(name.substring(GROUP_PREFIX.length())));
                }
            }
        }
        return result;
    }

    @Override
    public void addGroup(String username, String group) {
        String groupName = GROUP_PREFIX + group;
        if (users.getProperty(groupName) == null) {
            addUserInternal(groupName, "group");
        }
        addRole(username, groupName);
    }

    @Override
    public void deleteGroup(String username, String group) {
        deleteRole(username, GROUP_PREFIX + group);

        // garbage collection, clean up the groups if needed
        for (UserPrincipal user : listUsers()) {
            for (GroupPrincipal g : listGroups(user)) {
                if (group.equals(g.getName())) {
                    // there is another user of this group, nothing to clean up
                    return;
                }
            }
        }

        // nobody is using this group any more, remove it
        deleteUser(GROUP_PREFIX + group);
    }

    @Override
    public void addGroupRole(String group, String role) {
        addRole(GROUP_PREFIX + group, role);
    }

    @Override
    public void deleteGroupRole(String group, String role) {
        deleteRole(GROUP_PREFIX + group, role);
    }

    @Override
    public void createGroup(String group) {
        String groupName = GROUP_PREFIX + group;
        if (users.getProperty(groupName) == null) {
            addUserInternal(groupName, "group");
        } else {
            throw new IllegalArgumentException("Group: " + group + " already exists");
        }
    }
}
