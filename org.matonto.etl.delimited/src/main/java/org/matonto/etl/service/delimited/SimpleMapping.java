package org.matonto.etl.service.delimited;

/*-
 * #%L
 * org.matonto.etl.delimited
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
import java.util.Optional;

public class SimpleMapping implements Mapping {
    private MappingId id;
    private Model entities;
    private Optional<Resource> sourceOntologyId;
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
        this.entities = mf.createModel();
    }

    public SimpleMapping(Model model, ValueFactory vf, ModelFactory mf) throws MatOntoException {
        set(model, vf, mf);
    }

    public SimpleMapping(File file, ValueFactory vf, ModelFactory mf) throws IOException, MatOntoException {
        RDFFormat mapFormat;
        mapFormat = Rio.getParserFormatForFileName(file.getName()).orElseThrow(IllegalArgumentException::new);
        FileReader reader = new FileReader(file);
        Model model = Values.matontoModel(Rio.parse(reader, "", mapFormat));
        set(model, vf, mf);
    }

    public SimpleMapping(InputStream in, RDFFormat format, ValueFactory vf, ModelFactory mf) throws IOException, MatOntoException {
        Model model = Values.matontoModel(Rio.parse(in, "", format));
        set(model, vf, mf);
    }

    public SimpleMapping(String jsonld, ValueFactory vf, ModelFactory mf) throws IOException, MatOntoException {
        InputStream in = new ByteArrayInputStream(jsonld.getBytes(StandardCharsets.UTF_8));
        Model model = Values.matontoModel(Rio.parse(in, "", RDFFormat.JSONLD));
        set(model, vf, mf);
    }

    @Override
    public MappingId getId() {
        return id;
    }

    @Override
    public Model getEntities() {
        return entities;
    }

    @Override
    public Optional<Resource> getSourceOntologyId() {
        return sourceOntologyId;
    }

    @Override
    public Model asModel() {
        return model;
    }

    private void set(Model model, ValueFactory vf, ModelFactory mf) throws MatOntoException {
        if (!model.contains(null, vf.createIRI(Delimited.TYPE.stringValue()),
                vf.createIRI(Delimited.MAPPING.stringValue()))) {
            throw new MatOntoException("Mapping is not valid");
        }
        Resource mappingIRI = model.filter(null, vf.createIRI(Delimited.TYPE.stringValue()),
                vf.createIRI(Delimited.MAPPING.stringValue())).subjects().toArray(new Resource[1])[0];

        if (model.contains(mappingIRI, vf.createIRI(Delimited.VERSION.stringValue()), null)) {
            Resource versionIRI = vf.createIRI(model.filter(mappingIRI, vf.createIRI(Delimited.VERSION.stringValue()),
                    null).objects().toArray()[0].toString());
            this.id = new SimpleMappingId.Builder(vf).mappingIRI(vf.createIRI(mappingIRI.stringValue()))
                    .versionIRI(vf.createIRI(versionIRI.stringValue())).build();
        } else {
            this.id = new SimpleMappingId.Builder(vf).mappingIRI(vf.createIRI(mappingIRI.stringValue())).build();
        }
        if (model.contains(mappingIRI, vf.createIRI(Delimited.SOURCE_ONTOLOGY.stringValue()), null)) {
            this.sourceOntologyId = Optional.of(vf.createIRI(model.filter(mappingIRI,
                    vf.createIRI(Delimited.SOURCE_ONTOLOGY.stringValue()), null).objects().toArray()[0].toString()));
        } else {
            this.sourceOntologyId = Optional.empty();
        }
        Model entities = mf.createModel(model);
        entities.remove(mappingIRI, null, null);
        this.entities = entities;
        this.model = model;
    }
}
