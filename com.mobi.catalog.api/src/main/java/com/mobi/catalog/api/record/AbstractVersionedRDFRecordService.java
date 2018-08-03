package com.mobi.catalog.api.record;

/*-
 * #%L
 * com.mobi.catalog.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

import com.mobi.catalog.api.Catalogs;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.mergerequest.MergeRequestManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordExportSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.config.VersionedRDFRecordCreateSettings;
import com.mobi.catalog.api.record.config.VersionedRDFRecordExportSettings;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.BatchExporter;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.security.policy.api.xacml.XACMLPolicy;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import com.mobi.security.policy.api.xacml.jaxb.PolicyType;
import org.w3c.dom.Document;
import org.xml.sax.SAXException;

import java.io.IOException;
import java.io.StringWriter;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import javax.annotation.Nonnull;
import javax.xml.bind.JAXB;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

/**
 * Defines functionality for VersionedRDFRecordService. Provides common methods for exporting and deleting a Record.
 * Overrides exportRecord() and deleteRecord() to perform VersionedRDFRecord specific operations such as writing
 * out Branches, Commits, and Tags.
 * @param <T> of VersionedRDFRecord
 */
public abstract class AbstractVersionedRDFRecordService<T extends VersionedRDFRecord>
        extends AbstractRecordService<T> implements RecordService<T> {

    protected CommitFactory commitFactory;
    protected BranchFactory branchFactory;
    protected MergeRequestManager mergeRequestManager;
    protected VersioningManager versioningManager;
    protected XACMLPolicyManager xacmlPolicyManager;

    private static String fileLocation;
    private String filePath;

    static {
        StringBuilder builder = new StringBuilder(System.getProperty("java.io.tmpdir"));
        if (!System.getProperty("java.io.tmpdir").endsWith("/")) {
            builder.append("/");
        }
        fileLocation = builder.append("com.mobi.catalog.api/").toString();
    }

    @Override
    protected void exportRecord(T record, RecordOperationConfig config, RepositoryConnection conn) {
        BatchExporter exporter = config.get(RecordExportSettings.BATCH_EXPORTER);
        writeRecordData(record, exporter);
        if (config.get(VersionedRDFRecordExportSettings.WRITE_VERSIONED_DATA)) {
            writeVersionedRDFData(record, config.get(VersionedRDFRecordExportSettings.BRANCHES_TO_EXPORT),
                    exporter, conn);
        }
    }

    @Override
    public T createRecord(User user, RecordOperationConfig config, OffsetDateTime issued, OffsetDateTime modified,
                          RepositoryConnection conn) {
        T record = createRecordObject(config, issued, modified, conn);
        Branch masterBranch = createMasterBranch(record);
        conn.begin();
        addRecord(record, masterBranch, conn);
        IRI catalogIdIRI = valueFactory.createIRI(config.get(RecordCreateSettings.CATALOG_ID));
        Resource masterBranchId = masterBranch.getResource();
        Model model = config.get(VersionedRDFRecordCreateSettings.INITIAL_COMMIT_DATA);
        versioningManager.commit(catalogIdIRI, record.getResource(),
                masterBranchId, user, "The initial commit.", model, null);
        conn.commit();
        writePolicies(user, record);
        return record;
    }

    protected void writePolicies(User user, T record) {
        try {
            /* -- recordPolicy doc -- */
            String path = copyToTemp("recordPolicy.xml");
            filePath = "file:" + path;
            DocumentBuilderFactory docFactory = DocumentBuilderFactory.newInstance();
            DocumentBuilder docBuilder = docFactory.newDocumentBuilder();
            Document recordPolicy = docBuilder.parse(filePath);
            String str = convertDocumentToString(recordPolicy);
            str.replaceAll("(%USERIRI%)", user.getResource().stringValue());
            str.replaceAll("(%RECORDIRI%)", record.getResource().stringValue());
            str.replaceAll("(%RECORDIRIENCODED%)", record.getResource().stringValue());
            PolicyType recordPolicyType = JAXB.unmarshal(str, PolicyType.class);
            addPolicy(recordPolicyType);

            /* -- policyPolicy doc -- */
            String pathPolicy = copyToTemp("policyPolicy.xml");
            filePath = "file:" + pathPolicy;
            Document policyPolicy = docBuilder.parse(filePath);
            String strPolicyPolicy = convertDocumentToString(policyPolicy);
            strPolicyPolicy.replaceAll("(%USERIRI%)", user.toString());
            strPolicyPolicy.replaceAll("(%POLICYIRI%)", recordPolicyType.getPolicyId());
            strPolicyPolicy.replaceAll("(%POLICYIRIENCODED%)", record.getResource().stringValue());
            PolicyType policyPolicyType = JAXB.unmarshal(str, PolicyType.class);
            addPolicy(policyPolicyType);

        } catch (ParserConfigurationException pce) {
            pce.printStackTrace();
        } catch (IOException ioe) {
            ioe.printStackTrace();
        } catch (SAXException sae) {
            sae.printStackTrace();
        }
    }

    private static String convertDocumentToString(Document doc) {
        TransformerFactory tf = TransformerFactory.newInstance();
        Transformer transformer;
        String output = null;
        try {
            transformer = tf.newTransformer();
            StringWriter writer = new StringWriter();
            transformer.transform(new DOMSource(doc), new StreamResult(writer));
            output = writer.getBuffer().toString();
        } catch (TransformerException e) {
            e.printStackTrace();
        }
        return output;
    }

    private String copyToTemp(String resourceName) throws IOException {
        String absolutePath = fileLocation + resourceName;
        Files.copy(getClass().getResourceAsStream("/" + resourceName), Paths.get(absolutePath),
                StandardCopyOption.REPLACE_EXISTING);
        return absolutePath;
    }

    protected Resource addPolicy(PolicyType policyType) {
        XACMLPolicy xacmlPolicy = xacmlPolicyManager.createPolicy(policyType);
        return xacmlPolicyManager.addPolicy(xacmlPolicy);
    }

    protected void deletePolicies(T record) {
        String recordResourceStr = record.getResource().stringValue();
        //use a sparkle query like CatalogManager to get recordp and pp
        IRI policyId = ;
        IRI policyPolicyId = ;
        xacmlPolicyManager.deletePolicy(policyId);
        xacmlPolicyManager.deletePolicy(policyPolicyId);
    }

    /**
     * Adds the record and masterBranch to the repository.
     *
     * @param record The VersionedRDFRecord to add to the repository
     * @param masterBranch The initialized masterBranch to add to the repository
     * @param conn A RepositoryConnection to use for lookup
     */
    protected void addRecord(T record, Branch masterBranch, RepositoryConnection conn) {
        utilsService.addObject(record, conn);
        utilsService.addObject(masterBranch, conn);
    }

    /**
     * Creates a MasterBranch to be initialized based on (record, conn) from the repository.
     *
     * @param record The VersionedRDFRecord to add to a MasterBranch
     */
    protected Branch createMasterBranch(VersionedRDFRecord record) {
        Branch branch = createBranch("MASTER", "The master branch.");
        record.setMasterBranch(branch);
        Set<Branch> branches = record.getBranch_resource().stream()
                .map(branchFactory::createNew)
                .collect(Collectors.toSet());
        branches.add(branch);
        record.setBranch(branches);
        return branch;
    }

    /**
     * Creates a branch specific to (title, description, factory).
     *
     * @param title Name of desired branch
     * @param description Short description of the title branch
     */
    protected Branch createBranch(@Nonnull String title, String description) {
        OffsetDateTime now = OffsetDateTime.now();

        Branch branch = branchFactory.createNew(valueFactory.createIRI(Catalogs.BRANCH_NAMESPACE + UUID.randomUUID()));
        branch.setProperty(valueFactory.createLiteral(title), valueFactory.createIRI(_Thing.title_IRI));
        branch.setProperty(valueFactory.createLiteral(now), valueFactory.createIRI(_Thing.issued_IRI));
        branch.setProperty(valueFactory.createLiteral(now), valueFactory.createIRI(_Thing.modified_IRI));
        if (description != null) {
            branch.setProperty(valueFactory.createLiteral(description), valueFactory.createIRI(_Thing.description_IRI));
        }
        return branch;
    }

    @Override
    protected void deleteRecord(T record, RepositoryConnection conn) {
        deleteRecordObject(record, conn);
        deletePolicies(record);
        deleteVersionedRDFData(record, conn);
    }

    /**
     * Deletes VersionedRDFRecord specific data (Branches, Commits, Tags) from the repository.
     *
     * @param record The VersionedRDFRecord to delete
     * @param conn A RepositoryConnection to use for lookup
     */
    protected void deleteVersionedRDFData(T record, RepositoryConnection conn) {
        recordFactory.getExisting(record.getResource(), record.getModel())
                .ifPresent(versionedRDFRecord -> {
                    mergeRequestManager.deleteMergeRequestsWithRecordId(versionedRDFRecord.getResource(), conn);
                    versionedRDFRecord.getVersion_resource()
                            .forEach(resource -> utilsService.removeVersion(versionedRDFRecord.getResource(),
                                    resource, conn));
                    conn.remove(versionedRDFRecord.getResource(),
                            valueFactory.createIRI(VersionedRDFRecord.masterBranch_IRI),null,
                            versionedRDFRecord.getResource());
                    List<Resource> deletedCommits = new ArrayList<>();
                    versionedRDFRecord.getBranch_resource()
                            .forEach(resource -> utilsService.removeBranch(versionedRDFRecord.getResource(),
                                    resource, deletedCommits, conn));
                });
    }

    /**
     * Writes the VersionedRDFRecord data (Branches, Commits, Tags) to the provided ExportWriter
     * If the provided branchesToWrite is empty, will write out all branches.
     *
     * @param record The VersionedRDFRecord to write versioned data
     * @param branchesToWrite The Set of Resources identifying branches to write out
     * @param exporter The ExportWriter to write the VersionedRDFRecord to
     * @param conn A RepositoryConnection to use for lookup
     */
    protected void writeVersionedRDFData(VersionedRDFRecord record, Set<Resource> branchesToWrite,
                                       BatchExporter exporter, RepositoryConnection conn) {
        Set<Resource> processedCommits = new HashSet<>();

        // Write Branches
        record.getBranch_resource().forEach(branchResource -> {
            if (branchesToWrite.isEmpty() || branchesToWrite.contains(branchResource)) {
                Branch branch = utilsService.getBranch(record, branchResource, branchFactory, conn);
                branch.getModel().forEach(exporter::handleStatement);
                Resource headIRI = utilsService.getHeadCommitIRI(branch);

                // Write Commits
                for (Resource commitId : utilsService.getCommitChain(headIRI, false, conn)) {

                    if (processedCommits.contains(commitId)) {
                        break;
                    } else {
                        processedCommits.add(commitId);
                    }

                    // Write Commit/Revision Data
                    Commit commit = utilsService.getExpectedObject(commitId, commitFactory, conn);
                    commit.getModel().forEach(exporter::handleStatement);

                    // Write Additions/Deletions Graphs
                    Difference revisionChanges = utilsService.getRevisionChanges(commitId, conn);
                    revisionChanges.getAdditions().forEach(exporter::handleStatement);
                    revisionChanges.getDeletions().forEach(exporter::handleStatement);
                }
            }
        });
    }
}
