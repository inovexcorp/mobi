package org.matonto.etl.service.delimited;

import org.matonto.etl.api.delimited.Mapping;
import org.matonto.etl.api.delimited.MappingId;
import org.matonto.exception.MatOntoException;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.utils.Values;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.List;

public class SimpleMapping implements Mapping {
    private MappingId id;
    private Model model;

    public SimpleMapping(MappingId id, ModelFactory mf, ValueFactory vf) {
        this.id = id;
        Model model = mf.createModel();
        Resource sub = id.getMappingIRI().isPresent() ? id.getMappingIRI().get() : id.getMappingIdentifier();
        model.add(sub, vf.createIRI(Delimited.TYPE.stringValue()), vf.createIRI(Delimited.MAPPING.stringValue()));
        if (id.getVersionIRI().isPresent()) {
            model.add(sub, vf.createIRI(Delimited.VERSION.stringValue()), id.getVersionIRI().get());
        }
        this.model = model;
    }

    public SimpleMapping(Model model, ValueFactory vf) throws MatOntoException {
        set(model, vf);
    }

    public SimpleMapping(File file, ValueFactory vf) throws IOException, MatOntoException {
        RDFFormat mapFormat;
        mapFormat = Rio.getParserFormatForFileName(file.getName()).orElseThrow(IllegalArgumentException::new);
        FileReader reader = new FileReader(file);
        Model model = Values.matontoModel(Rio.parse(reader, "", mapFormat));
        set(model, vf);
    }

    public SimpleMapping(InputStream in, RDFFormat format, ValueFactory vf) throws IOException, MatOntoException {
        Model model = Values.matontoModel(Rio.parse(in, "", format));
        set(model, vf);
    }

    public SimpleMapping(String jsonld, ValueFactory vf) throws IOException, MatOntoException {
        InputStream in = new ByteArrayInputStream(jsonld.getBytes(StandardCharsets.UTF_8));
        Model model = Values.matontoModel(Rio.parse(in, "", RDFFormat.JSONLD));
        set(model, vf);
    }

    @Override
    public MappingId getId() {
        return id;
    }

    @Override
    public Model getModel() {
        return model;
    }

    private void set(Model model, ValueFactory vf) throws MatOntoException {
        if (!model.contains(null, vf.createIRI(Delimited.TYPE.stringValue()),
                vf.createIRI(Delimited.MAPPING.stringValue()))) {
            throw new MatOntoException("Mapping is not valid");
        }
        Resource mappingIRI = model.filter(null, vf.createIRI(Delimited.TYPE.stringValue()),
                vf.createIRI(Delimited.MAPPING.stringValue())).subjects().toArray(new Resource[1])[0];

        if (model.contains(mappingIRI, vf.createIRI(Delimited.VERSION.stringValue()), null)) {
            Resource versionIRI = vf.createIRI(model.filter(mappingIRI, vf.createIRI(Delimited.VERSION.stringValue()),
                    null).objects().toArray()[0].toString());
            id = new SimpleMappingId.Builder(vf).mappingIRI(vf.createIRI(mappingIRI.stringValue()))
                    .versionIRI(vf.createIRI(versionIRI.stringValue())).build();
        } else {
            id = new SimpleMappingId.Builder(vf).mappingIRI(vf.createIRI(mappingIRI.stringValue())).build();
        }
        this.model = model;
    }
}
