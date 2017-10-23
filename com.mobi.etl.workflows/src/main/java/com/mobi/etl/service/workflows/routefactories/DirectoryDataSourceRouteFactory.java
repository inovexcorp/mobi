package com.mobi.etl.service.workflows.routefactories;

/*-
 * #%L
 * com.mobi.etl.workflows
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.etl.api.ontologies.etl.DirectoryDataSource;
import com.mobi.etl.api.workflows.DataSourceRouteFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import org.apache.camel.CamelContext;
import org.apache.camel.Endpoint;
import org.apache.camel.component.file.FileComponent;
import org.apache.camel.component.file.FileEndpoint;

import java.io.File;

@Component(immediate = true)
public class DirectoryDataSourceRouteFactory implements DataSourceRouteFactory<DirectoryDataSource> {

    private ValueFactory vf;
    private CamelContext context;

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setContext(CamelContext context) {
        this.context = context;
    }

    @Override
    public Resource getTypeIRI() {
        return vf.createIRI(DirectoryDataSource.TYPE);
    }

    @Override
    public Class<DirectoryDataSource> getType() {
        return DirectoryDataSource.class;
    }

    @Override
    public Endpoint getEndpoint(DirectoryDataSource dataSource) {
        String filePath = dataSource.getFilePath().orElseThrow(() ->
                new IllegalArgumentException("DataSource must have a file path"));
        FileComponent component = new FileComponent();
        FileEndpoint endpoint = new FileEndpoint("file:" + filePath, component);
        endpoint.setCamelContext(context);
        endpoint.setFile(new File(filePath));
        endpoint.setNoop(true);
        endpoint.setIdempotent(true);
        endpoint.setProbeContentType(true);
        endpoint.setStartingDirectoryMustExist(true);
        endpoint.setDirectoryMustExist(true);
        return endpoint;
    }
}
