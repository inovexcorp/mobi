package com.mobi.catalog.api.record;

/*-
 * #%L
 * com.mobi.catalog.api.record
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

import com.mobi.catalog.api.ontologies.mcat.UnversionedRecord;
import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.ResourceUtils;
import com.mobi.rdf.api.Resource;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.security.policy.api.xacml.XACMLPolicy;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;
import org.osgi.service.component.annotations.Reference;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

public abstract class AbstractUnversionedRecordService<T extends UnversionedRecord>
        extends AbstractRecordService<T> implements RecordService<T> {

    private static final String USER_IRI_BINDING = "%USERIRI%";
    private static final String POLICY_IRI_BINDING = "%POLICYIRI%";
    private static final String ENCODED_POLICY_IRI_BINDING = "%POLICYIRIENCODED%";

    @Reference
    public XACMLPolicyManager xacmlPolicyManager;

    @Override
    protected void deleteRecord(T record, RepositoryConnection conn) {
        recordFactory.getExisting(record.getResource(), record.getModel())
            .ifPresent(unversionedRecord -> {
                unversionedRecord.getUnversionedDistribution_resource().forEach(resource ->
                    utilsService.remove(resource, conn));
                deleteRecordObject(record, conn);
            });
    }

    /**
     * Creates two policy files for the Record based on default templates. One policy to control who can view and modify
     * the Record. The other for who can modify the aforementioned policy.
     *
     * @param user The Resource of the user who created the Record and associated Policy files
     * @param recordId The Resource of the Record to write out
     */
    protected void writePolicies(Resource user, Resource recordId) {
        Optional<Resource> recordPolicyResource = writeRecordPolicy(user, recordId);
        if (recordPolicyResource.isPresent()) {
            writeRecordPolicyPolicy(user, recordId, recordPolicyResource.get());
        }
    }

    /**
     * Creates a policy file based on default templates that controls who can modify the policy for the Record.
     *
     * @param user The Resource of the user who created the Record and associated Policy files
     * @param recordId The Resource of the Record to write out
     * @param recordPolicyResource The Resource of the Record policy
     */
    protected void writeRecordPolicyPolicy(Resource user, Resource recordId,  Resource recordPolicyResource) {
        try {
            String encodedRecordIRI = ResourceUtils.encode(recordId);
            String[] search = {USER_IRI_BINDING, POLICY_IRI_BINDING, ENCODED_POLICY_IRI_BINDING};
            String[] replace = {user.stringValue(), recordPolicyResource.stringValue(), encodedRecordIRI};
            InputStream policyPolicyStream = AbstractVersionedRDFRecordService.class
                    .getResourceAsStream("/policyPolicy.xml");
            String policyPolicy = StringUtils.replaceEach(IOUtils.toString(policyPolicyStream, StandardCharsets.UTF_8),
                    search, replace);
            addPolicy(policyPolicy);
        } catch (IOException e) {
            throw new MobiException("Error writing record policy.", e);
        }
    }

    /**
     * Creates a policy file based on default templates that controls who can view and modify the Record.
     * There are no default record policy for un-versioned records
     *
     * @param user The Resource of the user who created the Record and associated Policy files
     * @param recordId The Resource of the Record to write out
     */
    protected Optional<Resource> writeRecordPolicy(Resource user, Resource recordId) {
        return Optional.empty();
    }

    /**
     * Uses the {@link XACMLPolicyManager} to add the Policy file to the repository and virtual filesystem.
     *
     * @param policyString A string representation of a policy
     * @return The {@link Resource} of the new Policy
     */
    protected Resource addPolicy(String policyString) {
        XACMLPolicy policy = new XACMLPolicy(policyString, valueFactory);
        return xacmlPolicyManager.addPolicy(policy);
    }
}
