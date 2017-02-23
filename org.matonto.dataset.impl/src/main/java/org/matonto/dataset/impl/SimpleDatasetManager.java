package org.matonto.dataset.impl;

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Modified;
import org.matonto.dataset.api.DatasetManager;
import org.matonto.dataset.api.builder.DatasetRecordConfig;
import org.matonto.dataset.ontology.dataset.DatasetRecord;
import org.matonto.rdf.api.Resource;

import java.util.Map;
import java.util.Set;

@Component
public class SimpleDatasetManager implements DatasetManager {

    @Activate
    private void start(Map<String, Object> props) {

    }

    @Modified
    protected void modified(Map<String, Object> props) {
        //start(props);
    }

    @Override
    public Set<Resource> listDatasets() {
        return null;
    }

    @Override
    public DatasetRecord getDatasetRecord(Resource dataset) {
        return null;
    }

    @Override
    public DatasetRecord createDataset(DatasetRecordConfig config) {
        return null;
    }

    @Override
    public void deleteDataset(Resource dataset) {

    }

    @Override
    public void safeDeleteDataset(Resource dataset) {

    }

    @Override
    public void clearDataset(Resource dataset) {

    }

    @Override
    public void safeClearDataset(Resource dataset) {

    }
}
