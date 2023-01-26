package com.mobi.utils.cli;

/*-
 * #%L
 * com.mobi.utils.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import com.mobi.security.policy.api.xacml.XACMLPolicy;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Completion;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.apache.karaf.shell.support.completers.FileCompleter;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Command(scope = "mobi", name = "reload-system-policy", description = "Reloads a system policy in Mobi")
@Service
public class ReloadSystemPolicy implements Action {

    private static final Logger LOGGER = LoggerFactory.getLogger(ReloadSystemPolicy.class);

    ValueFactory vf = new ValidatingValueFactory();

    @Reference
    XACMLPolicyManager policyManager;

    @Argument(name = "PolicyFilePath", description = "The path to the system policy file. The policy filename must be" +
            "URI encoded and have any percent sign escaped (i.e., %2f become \\%2f).")
    @Completion(FileCompleter.class)
    String filePath = null;

    @Override
    public Object execute() throws Exception {
        if (StringUtils.isEmpty(filePath)) {
            System.out.println("A valid file must be provided.");
            throw new IllegalArgumentException("A valid file must be provided.");
        }
        Path file = Paths.get(filePath);
        String fileName = URLDecoder.decode(
                FilenameUtils.getName(file.getFileName().toString()), StandardCharsets.UTF_8);
        String fileId = FilenameUtils.removeExtension(
                URLDecoder.decode(fileName, StandardCharsets.UTF_8));
        Resource policyId = vf.createIRI(fileId);

        if (policyManager.getSystemPolicyIds().contains(policyId)) {
            LOGGER.info("Reloading policy: " + file);
            XACMLPolicy oldPolicy = policyManager.getPolicy(policyId)
                    .orElseThrow(() -> new IllegalStateException("Policy can not be retrieved"));
            policyManager.deletePolicy(policyId);
            String policyContents = new String(Files.newInputStream(file).readAllBytes(), StandardCharsets.UTF_8);
            try {
                policyManager.loadSystemPolicyIfAbsent(policyContents);
                System.out.println("Policy " + policyId.stringValue() + " successfully updated.");
            } catch (Exception e) {
                LOGGER.error("Could not load updated policy", e);
                System.out.println("Could not load updated policy. See logs for details.");
                policyManager.addSystemPolicy(oldPolicy);
            }
        } else {
            System.out.println("Policy " + policyId.stringValue() + " is not a registered system policy.");
        }

        return null;
    }
}
